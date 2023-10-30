/**
 * 1. install jsonwebtoken package
 * 2. import it const jwt = require('jsonwebtoken');
 * 3. create token- const token = jwt.sign(user, "add secret here", {
        expiresIn: '1h',
      });
 * 4.  how to crate secret? open terminal type node then enter then type this - require('crypto').randomBytes(64).toString('hex')
 *
 * --------------------------
 * Where To Save Your Token
 * --------------------------
 * The best way to save your token is in cookie
 * now install cookie parser
 *  install cookie parser - npm install cookie-parser
 * send cookie in res like this .cookie('token', token, {
          httpOnly: true,
          secure: false,
          sameSite: 'none',
        })
        .send({ success: true });     
 * but cookie will not save in client side you have to do some more steps
 * step 1- create a middleware using cors to set origin & credential like this - app.use(
  cors({
    origin: ['http://localhost:5173/'],
    credentials: true,
  })
);
 * step 2- add WithCredential: true in client side
 *
 * 
 * 
 * 
 */
