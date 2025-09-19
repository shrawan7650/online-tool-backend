import axios from "axios";


export const googleOAuth = async (req, res) => {
  console.log("googleOAuth-body", req.body);
  const googleToken = req.body.token;
  console.log("googleToken", googleToken);

  if (!googleToken) {
    res.status(400).json({ message: "Google token is required." });
    return;
  }

  const googleRes = await axios.get(
    `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${googleToken}`
  );
  // console.log("googleRes", googleRes.data);

  return googleRes.data;
};
 