import { TraceLogger } from "../logging/logger";

declare global {
   namespace Express {
      interface Request {
         logger: TraceLogger;
      }
   }
}