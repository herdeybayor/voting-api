import { Request } from 'express';
import { User } from 'src/users/interfaces/user.interface';

interface RequestWithUser extends Request {
  user: User;
}

export default RequestWithUser;
