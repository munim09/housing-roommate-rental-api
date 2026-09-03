import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application } from "express";

const app: Application = express();

// app.use("/api/subscription/webhook", express.raw({ type: 'application/json' }))

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
    cors({
        origin: `${process.env.APP_URL}`,
        credentials: true,
    }),
);

app.get("/", async (req: Request, res: Response) => {
    res.send("Hello, World!");
});

export default app;
