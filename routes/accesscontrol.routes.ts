import express from 'express';
import { getRoles, getAccessControl, addAccessControl , updateAccessControl } from '../controllers/accesscontrol.controller';
import { authenticateToken } from '../middleware/middleware';

const router = express.Router();

router.get('/getRoles', authenticateToken, getRoles);
router.get('/getAccessControl/:roleId', authenticateToken, getAccessControl);
router.post('/addAccessControl', authenticateToken, addAccessControl);
router.post('/updateAccessControl', authenticateToken, updateAccessControl);

export default router;