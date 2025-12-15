const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testApiKey() {
  const apiKey = "fhgfgfhgftrytdgcghcttydhgfhgfyf";
  
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
    
    console.log("Testing API key with simple query...");
    const result = await model.generateContent("Say hello world");
    console.log("✓ API KEY WORKS!");
    console.log("Response:", result.response.text());
  } catch (error) {
    console.error("✗ API KEY ERROR:");
    console.error("Status:", error.status);
    console.error("Message:", error.message);
  }
}

testApiKey();

