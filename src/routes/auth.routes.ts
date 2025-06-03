import { Router } from 'express-serve-static-core';
import { login, register, validateToken } from '../controllers/auth.controller';
// import { validate } from 'express-validation';
// You might want to add validation middleware here

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.post('/validate', validateToken);

export default router;
