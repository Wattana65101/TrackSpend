// Google OAuth client ID สำหรับใช้กับ @react-native-google-signin (webClientId)
// และสำหรับ server ใช้ตรวจ idToken ผ่าน tokeninfo
const googleClient = require("./google-client.json");
// webClientId ต้องเป็น Web application client ID เท่านั้น (ห้ามใช้ Android client ID)
const rawWeb = googleClient.web?.client_id || process.env.GOOGLE_WEB_CLIENT_ID;
const clientId =
  rawWeb && !rawWeb.includes("REPLACE_WITH_WEB_CLIENT_ID")
    ? rawWeb
    : googleClient.installed?.client_id;

module.exports = { GOOGLE_WEB_CLIENT_ID: clientId };
