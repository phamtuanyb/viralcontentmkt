import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, geminiApiKey } = await req.json();

    if (!content || !geminiApiKey) {
      return new Response(
        JSON.stringify({ error: "Missing content or API key" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build the prompt with the content
    const finalPrompt = REWRITE_PROMPT.replace("{original_content}", content);

    // Call Gemini API
    const model = "gemini-1.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(geminiApiKey)}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: finalPrompt }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 8192,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });

      // Invalid/unauthorized API key
      if (response.status === 401 || response.status === 403) {
        return new Response(
          JSON.stringify({
            error: "API Key không hợp lệ hoặc đã hết hạn. Vui lòng kiểm tra lại API Key của bạn.",
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      // Client errors (request too large, malformed, etc.)
      if (response.status === 400) {
        return new Response(
          JSON.stringify({
            error:
              "Yêu cầu không hợp lệ hoặc nội dung quá dài. Vui lòng rút gọn nội dung và thử lại.",
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      // Rate limit
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Bạn đang gửi quá nhanh. Vui lòng chờ 1 lát rồi thử lại." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      // Other errors
      return new Response(
        JSON.stringify({ error: "Lỗi khi gọi Gemini API. Vui lòng thử lại sau." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await response.json();
    const rewrittenContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rewrittenContent) {
      return new Response(
        JSON.stringify({ error: "Không nhận được kết quả từ AI. Vui lòng thử lại." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ rewrittenContent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in ai-rewrite function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
