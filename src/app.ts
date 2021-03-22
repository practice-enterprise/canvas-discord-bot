import dotenv from 'dotenv';
import { buildClient } from './discord';
<<<<<<< HEAD
import { RoleAssignmentService } from './roleAssignment';
=======
import { CanvasService } from './services/canvas-service';
>>>>>>> origin/misc
import { ReminderService } from './services/reminder-service';

if (process.env.NODE_ENV == null || process.env.NODE_ENV === 'develepmont') {
  dotenv.config();
}

(async () => {
  const client = await buildClient();
  CanvasService.initAnnouncementJob('a40d37b54851efbcadb35e68bf03d698', client, '780572565240414208'); //Hard coded for now.
  ReminderService.initReminderJob(client);
  RoleAssignmentService.RoleAssignmentInit(client);
})();
