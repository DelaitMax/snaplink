import type { NextFunction, Request, Response } from "express";
import * as linksService from "@/services/links.service";
import * as clicksService from "@/services/clicks.service";
import { getClientIp } from "@/utils/getClientIp";
import { shortCodeParamSchema } from "@/schemas/links.schema";

export async function redirectToOriginalUrl(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { code } = shortCodeParamSchema.parse(req.params);
    const link = await linksService.resolveLinkForRedirect(code);

    res.redirect(302, link.originalUrl);

    void clicksService.recordClick({
      linkId: link.id,
      ip: getClientIp(req),
      userAgent: req.headers["user-agent"],
    });
  } catch (err) {
    next(err);
  }
}
