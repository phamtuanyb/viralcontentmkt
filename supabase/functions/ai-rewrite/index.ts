import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const REWRITE_PROMPT = `(Nhiệm vụ của bạn là VIẾT LẠI nội dung dưới đây theo cách diễn đạt mạch lạc, dễ đọc, rõ ràng và có tính thuyết phục hơn — nhưng phải TUÂN THỦ tuyệt đối các nguyên tắc sau:

❗ Không được thêm thông tin mới

❗ Không được bịa đặt dữ liệu

❗ Không được thay đổi ý nghĩa cốt lõi của nội dung

❗ Không thay đổi số liệu, giá tiền, thời gian, địa điểm

❗ Không thay đổi tên thương hiệu, sản phẩm, dịch vụ

❗ Không thay đổi link, số điện thoại, CTA nếu có

❗ Không lược bỏ các ý quan trọng

❗ Không chuyển sang phong cách quá sáng tạo

Bạn chỉ được:

✔ viết lại câu chữ cho mượt hơn

✔ tăng tính logic & dễ hiểu

✔ giữ nguyên thông điệp gốc

Hãy giữ:

- cấu trúc đoạn văn hợp lý

- bố cục dễ đọc

- giọng văn marketing phù hợp

Nội dung gốc cần viết lại:

---

{original_content}

---

Hãy trả về duy nhất:

- phần nội dung đã được viết lại

- không thêm lời giải thích

- không thêm tiêu đề phụ

- không chèn emoji

- không meta comment

)`;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content } = await req.json();

    if (!content) {
      return new Response(JSON.stringify({ error: "Missing content" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Require logged-in user (even though function is public)
    const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Missing SUPABASE_URL or SUPABASE_ANON_KEY env");
      return new Response(JSON.stringify({ error: "Server misconfigured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
      auth: {
        persistSession: false,
      },
    });

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      console.error("Unauthorized request - auth.getUser failed", userError?.message);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const finalPrompt = REWRITE_PROMPT.replace("{original_content}", content);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(JSON.stringify({ error: "Server AI key missing" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: finalPrompt }],
      }),
    });

    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("AI gateway error:", { status: aiResp.status, body: t });

      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Bạn đang gửi quá nhanh. Vui lòng thử lại sau." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (aiResp.status === 402) {
        return new Response(
          JSON.stringify({ error: "Hệ thống AI đang hết quota/credits. Vui lòng thử lại sau hoặc nạp thêm credits." }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      return new Response(JSON.stringify({ error: "Lỗi khi gọi AI. Vui lòng thử lại sau." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResp.json();
    const rewrittenContent = aiData?.choices?.[0]?.message?.content;

    if (!rewrittenContent) {
      console.error("AI gateway returned empty content", aiData);
      return new Response(JSON.stringify({ error: "Không nhận được kết quả từ AI. Vui lòng thử lại." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ rewrittenContent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in ai-rewrite function:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

