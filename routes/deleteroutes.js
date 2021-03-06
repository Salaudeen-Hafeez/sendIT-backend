import { Router } from 'express';
import { verifyAdminToken } from '../authentication/loginauth';
import { deleteUser, deletePackage, client } from '../database/db';

const deleteRouter = Router();

deleteRouter.delete(
  '/:email/:token/:username/:userid',
  verifyAdminToken,
  async (req, res) => {
    const userid = parseInt(req.params.userid);
    const userData = [req.params.username, userid];
    try {
      const deletedUser = await deleteUser(userData);
      if (deletedUser.rows[0].users_id) {
        const usersData = await client.query('SELECT * FROM users');
        res.json({ users: usersData.rows });
      }
    } catch (error) {
      res.status(400).json({ errMessage: error.message });
    }
  }
);

deleteRouter.delete(
  '/:email/:token/:username/packages/:parcelid/:status',
  async (req, res) => {
    const parcelid = parseInt(req.params.parcelid);
    const parcelCon = [req.params.username, parcelid];
    const status = req.params.status;
    try {
      const deletedParcel = await deletePackage(parcelCon);
      if (deletedParcel.rowCount !== 0) {
        const packages = await client.query('SELECT * FROM packages');
        res.json({ packages: packages.rows, package: deletedParcel.rows[0] });
      }
    } catch (error) {
      res.status(400).json({ errMessage: error.message });
    }
  }
);

export default deleteRouter;
