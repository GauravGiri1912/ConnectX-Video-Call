import httpStatus from "http-status";
import bcrypt from "bcrypt";
import { User } from "../models/user.model.js";
import { Meeting } from "../models/meeting.model.js";
import { extractBearerToken, signJwt, verifyJwt } from "../utils/jwt.js";

const sendAuthAwareError = (res, error) => {
    const authErrorMessages = ["Token missing", "Invalid token format", "Invalid token signature", "Token expired", "User not found"];
    const statusCode = authErrorMessages.includes(error.message)
        ? httpStatus.UNAUTHORIZED
        : httpStatus.INTERNAL_SERVER_ERROR;

    return res.status(statusCode).json({ message: `Something went wrong ${error.message}` });
};

const findUserFromRequestToken = async (req) => {
    const token = extractBearerToken(req);
    const decodedToken = verifyJwt(token);

    const user = await User.findById(decodedToken.userId);
    if (!user) {
        throw new Error("User not found");
    }

    return user;
};

const login = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(httpStatus.BAD_REQUEST).json({ message: "Please provide username and password" });
    }

    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(httpStatus.NOT_FOUND).json({ message: "User Not Found" });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if (!isPasswordCorrect) {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid Username or password" });
        }

        const token = signJwt({
            userId: user._id.toString(),
            username: user.username
        });

        return res.status(httpStatus.OK).json({ token });
    } catch (error) {
        return sendAuthAwareError(res, error);
    }
};

const register = async (req, res) => {
    const { name, username, password } = req.body;

    if (!name || !username || !password) {
        return res.status(httpStatus.BAD_REQUEST).json({ message: "Please provide name, username and password" });
    }

    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(httpStatus.CONFLICT).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            name,
            username,
            password: hashedPassword
        });

        await newUser.save();

        return res.status(httpStatus.CREATED).json({ message: "User Registered" });
    } catch (error) {
        return sendAuthAwareError(res, error);
    }
};

const getUserHistory = async (req, res) => {
    try {
        const user = await findUserFromRequestToken(req);

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const meetings = await Meeting.find({
            user_id: user.username,
            date: { $gte: sevenDaysAgo }
        }).sort({ date: -1 });
        return res.status(httpStatus.OK).json(meetings);
    } catch (error) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: `Something went wrong ${error}` });
    }
};

const addToHistory = async (req, res) => {
    const { meeting_code } = req.body;

    if (!meeting_code) {
        return res.status(httpStatus.BAD_REQUEST).json({ message: "Meeting code is required" });
    }

    try {
        const user = await findUserFromRequestToken(req);

        const newMeeting = new Meeting({
            user_id: user.username,
            meetingCode: meeting_code
        });

        await newMeeting.save();

        return res.status(httpStatus.CREATED).json({ message: "Added code to history" });
    } catch (error) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: `Something went wrong ${error}` });
    }
};

export { login, register, getUserHistory, addToHistory };
