import { RequestHandler } from 'express';

export const get404: RequestHandler = (req, res, next) => {
  res.status(404);
  res.render('404', {
    docTitle: '404 Page',
    path: req.url,
  });
};
