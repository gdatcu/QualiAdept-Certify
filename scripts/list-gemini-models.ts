import dotenv from 'dotenv';
dotenv.config();

async function listGeminiModels() {
  const apiKey =
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY;

  console.log('\n🔍 Checking Google Gemini API Key and Available Models...\n');

  if (!apiKey || !apiKey.trim()) {
    console.error('❌ Error: GOOGLE_GENERATIVE_AI_API_KEY is not set in your .env file!\n');
    process.exit(1);
  }

  console.log(`Using API Key (first 10 chars): ${apiKey.slice(0, 10)}...`);

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey.trim()}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok) {
      console.error('\n❌ Google Gemini API returned an error response:');
      console.error(JSON.stringify(data, null, 2));
      process.exit(1);
    }

    console.log('\n✅ Available Gemini Models for your API key:\n');
    if (data.models && Array.isArray(data.models)) {
      const generateModels = data.models.filter((m: any) =>
        m.supportedGenerationMethods?.includes('generateContent')
      );

      generateModels.forEach((m: any) => {
        const nameClean = m.name.replace('models/', '');
        console.log(` - ${nameClean} (${m.displayName || 'Model'})`);
      });

      console.log(`\nTotal supported models: ${generateModels.length}\n`);
    } else {
      console.log('No models returned from API:', data);
    }
  } catch (error) {
    console.error('❌ Failed to fetch models from Google Gemini API:', error);
  }
}

listGeminiModels();
