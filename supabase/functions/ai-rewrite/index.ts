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

✔ GIỮ NGUYÊN TẤT CẢ CÁC EMOJI/ICON có trong nội dung gốc (ví dụ: ❌, 🔴, 🎁, ✅, 🔥, ⭐, 💰, 📌, 👉, 💥, 🎯, ✨, 📣, 🚀, 💡, 🏆, 📢 v.v.)

Hãy giữ:

- cấu trúc đoạn văn hợp lý

- bố cục dễ đọc

- giọng văn marketing phù hợp

- TẤT CẢ CÁC EMOJI/ICON từ nội dung gốc phải được giữ nguyên vị trí và số lượng

Nội dung gốc cần viết lại:

---

{original_content}

---

Hãy trả về duy nhất:

- phần nội dung đã được viết lại

- không thêm lời giải thích

- không thêm tiêu đề phụ

- giữ nguyên tất cả emoji/icon từ nội dung gốc

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

    // Require logged-in user
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

    const userId = userData.user.id;

    // Fetch user's Gemini API key from user_profiles
    const { data: profileData, error: profileError } = await supabase
      .from("user_profiles")
      .select("gemini_api_key")
      .eq("user_id", userId)
      .single();

    if (profileError) {
      console.error("Error fetching user profile:", profileError.message);
      return new Response(JSON.stringify({ error: "Không thể lấy thông tin người dùng" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const geminiApiKey = profileData?.gemini_api_key;
    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({ error: "Bạn chưa cấu hình Gemini API Key. Vui lòng vào trang Cá nhân để nhập API Key." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const finalPrompt = REWRITE_PROMPT.replace("{original_content}", content);

    // Call Google Gemini API directly (user-provided API key)
    // Note: some preview model IDs can be unavailable depending on API version / key access.
    // Use the stable model id here.
    const GEMINI_MODEL = "gemini-2.5-flash";
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

    console.log(`Calling Gemini API with model: ${GEMINI_MODEL}`);

    const geminiResp = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Prefer header over query param to avoid leaking keys in URLs/logs.
        "x-goog-api-key": geminiApiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: finalPrompt }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 8192,
        },
      }),
    });

    if (!geminiResp.ok) {
      const errorText = await geminiResp.text();
      console.error("Gemini API error:", { status: geminiResp.status, body: errorText });

      if (geminiResp.status === 401 || geminiResp.status === 403) {
        return new Response(
          JSON.stringify({
            error:
              "API Key không hợp lệ hoặc không có quyền. Vui lòng kiểm tra lại Gemini API Key trong trang Cá nhân.",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      if (geminiResp.status === 404) {
        return new Response(
          JSON.stringify({
            error:
              "Model Gemini hiện không khả dụng cho API Key này (404). Vui lòng kiểm tra quyền truy cập model hoặc thử lại sau.",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      if (geminiResp.status === 429) {
        return new Response(
          JSON.stringify({ error: "Bạn đã vượt quá giới hạn API. Vui lòng thử lại sau hoặc kiểm tra quota API Key." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      if (geminiResp.status === 400) {
        // Check if it's a content too long error
        if (errorText.includes("too long") || errorText.includes("token")) {
          return new Response(JSON.stringify({ error: "Nội dung quá dài. Vui lòng giảm độ dài nội dung và thử lại." }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        return new Response(JSON.stringify({ error: "Yêu cầu không hợp lệ. Vui lòng thử lại." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "Lỗi khi gọi Gemini API. Vui lòng thử lại sau." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const geminiData = await geminiResp.json();
    console.log("Gemini API response received");

    const rewrittenContent = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rewrittenContent) {
      console.error("Gemini API returned empty content", JSON.stringify(geminiData));
      
      // Check for safety blocks
      if (geminiData?.candidates?.[0]?.finishReason === "SAFETY") {
        return new Response(
          JSON.stringify({ error: "Nội dung bị chặn do vi phạm chính sách an toàn của Gemini." }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({ error: "Không nhận được kết quả từ Gemini. Vui lòng thử lại." }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
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

