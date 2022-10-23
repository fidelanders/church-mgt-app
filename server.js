// import express from "express";
const express = require("express")
const dotenv = require("dotenv");
dotenv.config();
const userRouter = require("./routes/userRoute")

const app = express();
const port = process.env.PORT || 4400

app.use(express.json());

app.get('/', (_, res) =>{
	res.send("Hello World!!!");
})

app.use("/api/v1/users", userRouter);

app.listen(port, () => {
	console.log(`Server Ready: http://localhost:${port}`);
});