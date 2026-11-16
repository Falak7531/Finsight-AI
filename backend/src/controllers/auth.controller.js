
import { signUpchUser } from "../services/auth.service.js";

export const signUpController = async (req, res) => {
  try {

    // Get data from request body
    const { name, email, password } = req.body;

    // Call service
    const user = await signUpUser({
      name,
      email,
      password,
    });

    // Send response
    return res.status(201).json({
      message: "User registered successfully",
      user,
    });

  } catch (error) {

    console.error("Signup error:", error);

    return res.status(500).json({
      message: "Something went wrong",
    });
  }
};
