import { prisma } from "../utils/prisma.js";
import { hashPassword, comparePassword } from "../utils/hash.js";
import { generateToken } from "../utils/jwt.js";
import { verifyGoogleToken } from "../utils/google.js";

export const registerUser = async (email: string, password: string) => {
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error("User already exists");
  }

  const hashedPassword = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      provider: "LOCAL",
    },
  });

  const token = generateToken({ userId: user.id });

  return {
    user,
    token,
  };
};

export const loginUser = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error("Invalid credentials");
  }

  // Prevent logging in with a password if the user signed up via Google (and thus has no password)
  if (!user.password) {
    throw new Error("This account is linked with Google. Please use Continue with Google.");
  }

  const isValid = await comparePassword(password, user.password);

  if (!isValid) {
    throw new Error("Invalid credentials");
  }

  const token = generateToken({ userId: user.id });

  return {
    user,
    token,
  };
};

export const loginWithGoogleUser = async (idToken: string) => {
  const payload = await verifyGoogleToken(idToken);
  const { email, name, picture, sub: googleId } = payload;

  if (!email) {
    throw new Error("Google authentication failed: Email address not returned by Google");
  }

  let user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    // Register as a new user with Google provider
    user = await prisma.user.create({
      data: {
        email,
        name: name || null,
        avatar: picture || null,
        provider: "GOOGLE",
        googleId,
      },
    });
  } else {
    // User already exists. Link Google authentication if it is not already set
    if (user.provider !== "GOOGLE" || !user.googleId) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          provider: "GOOGLE",
          googleId: googleId || user.googleId,
          name: user.name || name || null,
          avatar: user.avatar || picture || null,
        },
      });
    }
  }

  const token = generateToken({ userId: user.id });

  return {
    user,
    token,
  };
};