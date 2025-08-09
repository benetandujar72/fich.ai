import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Set to true in production with HTTPS
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Local Strategy for email/password authentication
  passport.use(new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password'
    },
    async (email, password, done) => {
      try {
        const user = await storage.getUserByEmail(email);
        if (!user) {
          return done(null, false, { message: 'Email no registrat' });
        }

        const isValid = await bcrypt.compare(password, user.passwordHash || '');
        if (!isValid) {
          return done(null, false, { message: 'Contrasenya incorrecta' });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  ));

  passport.serializeUser((user: any, cb) => cb(null, user.id));
  passport.deserializeUser(async (id: string, cb) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return cb(null, false);
      }
      cb(null, user);
    } catch (error) {
      console.error("Deserialize error:", error);
      cb(null, false);
    }
  });

  // Login route
  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    res.json({ user: req.user, message: "Login exitós" });
  });

  // Register route
  app.post("/api/register", async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "L'email ja està registrat" });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user
      const newUser = await storage.upsertUser({
        id: globalThis.crypto.randomUUID(),
        email,
        firstName,
        lastName,
        passwordHash,
        role: "employee" // Default role
      });

      // Log the user in
      req.login(newUser, (err) => {
        if (err) {
          return res.status(500).json({ message: "Error en el login automàtic" });
        }
        res.json({ user: newUser, message: "Registre exitós" });
      });
    } catch (error) {
      console.error("Error in registration:", error);
      res.status(500).json({ message: "Error en el registre" });
    }
  });

  // Logout routes (both GET and POST for compatibility)
  const logoutHandler = (req: any, res: any) => {
    req.logout((err: any) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Error en el logout" });
      }
      
      // Destroy session completely
      req.session.destroy((destroyErr: any) => {
        if (destroyErr) {
          console.error("Session destroy error:", destroyErr);
        }
        
        // Clear the session cookie
        res.clearCookie('connect.sid');
        
        // Send response based on request type
        if (req.method === 'GET') {
          res.redirect('/');
        } else {
          res.json({ message: "Logout exitós" });
        }
      });
    });
  };

  app.post("/api/logout", logoutHandler);
  app.get("/api/logout", logoutHandler);
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  console.log('AUTH_DEBUG: Checking authentication for', req.method, req.url);
  console.log('AUTH_DEBUG: Session ID:', req.sessionID);
  console.log('AUTH_DEBUG: User object:', req.user);
  console.log('AUTH_DEBUG: isAuthenticated():', req.isAuthenticated());
  
  if (req.isAuthenticated()) {
    console.log('AUTH_DEBUG: Authentication successful');
    return next();
  }
  
  console.log('AUTH_DEBUG: Authentication failed');
  res.status(401).json({ message: "Unauthorized" });
};