import "dotenv/config";
import { SarvamAIClient } from "sarvamai";

const client = new SarvamAIClient({
  apiSubscriptionKey: process.env.SARVAM_API_KEY,
});

const sourceLanguage = "hi-IN";
const targetLanguage = "mr-IN";


export default client