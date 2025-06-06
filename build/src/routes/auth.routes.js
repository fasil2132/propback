"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_controller_1 = require("../controllers/auth.controller");
// import { validate } from 'express-validation';
// You might want to add validation middleware here
const router = express_1.default.Router();
router.post('/login', auth_controller_1.login);
router.post('/register', auth_controller_1.register);
router.post('/validate', auth_controller_1.validateToken);
exports.default = router;
