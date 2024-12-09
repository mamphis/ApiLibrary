import { TraceLogger } from "../util/logger";

declare global {
   namespace Express {
      interface Request {
         logger: TraceLogger;
      }
   }
}