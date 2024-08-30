import cartDao from "../persistence/MongoDB/cart.repository.js";
import userRepository from "../persistence/MongoDB/user.repository.js";
import passport from "passport";
import local from "passport-local"
import jwt from "passport-jwt"
import envs from "./env.conf.js"
import { createHash,isValidPassword } from "../utils/hashPass.js";
import { cookieExtractor } from "../utils/cookieExtractor.js";
import cartRepository from "../persistence/MongoDB/cart.repository.js";

const LocalStrategy = local.Strategy
const JWTStrategy = jwt.Strategy;
const ExtractJWT = jwt.ExtractJwt;





export const initializePassport = () =>{
///////////////////// Estrategia local de registro de usuario //////////////////////////////////
passport.use(
  'register',
   new LocalStrategy({passReqToCallback: true, usernameField:'email'}, async(req = request, username, password, done)=>{

    
    try   {
    const { first_name, last_name,email, age, role } = req.body
    const user = await userRepository.getByemail(username)
    if (user){
      user.first_name = "existe"  // agregado para poder devolver que ya existe el usuario en el res.status  del endpoint /login si 
                                  // sin pasar por la solucion de passportcall 
      
      
    return done(null,user)
                   }
    
   
      //const cart = await cartDao.createCart();
      const cart = await cartRepository.createCart();
      const new_user = {

        first_name,
        last_name,
        email,
        password : createHash(password),
        age,
        role,
        cart : cart._id
  
                       } 
      //console.log('new_user',new_user)                 

      const userCreate = await userRepository.create(new_user) ;
     // console.log('user creado ok',userCreate)
      //res.status(201).json({ status: "ok", msg: "User created" });
      return done(null,userCreate, {message: "User created successfully"})
      
               

          }
  catch (error){
     return done(error)
               }
 

            
             
} )

 )


 ////////////////////// Login con passport ///////////////////

 passport.use(
  "login",
    // new LocalStrategy({ usernameField: "email" }, async (username, password, done) => {
     new LocalStrategy({passReqToCallback: false, usernameField:'email'}, async(  username, password, done) => {
    
      try {
      //console.log('username_email ',username)
      let user = await userRepository.getByemail(username);
      
      //console.log('user desde passport login',user)
   ////////////////////////////////////////////////////////////////////////////////////////////////
          // if ( user == null || ! isValidPassword(password,user) )
          //              user = "invalido"
          //              console.log('user',user)
          //              console.log("isvalidpass",isValidPassword)
          //              passport.serializeUser((user, done) => {
          //               done(null, user);
          //             });
    ///////////////////////////////////////////////////////////////////////////////////////////////                  
                       if ( user == null  ){
                            user = "invalido"
                            
                            passport.serializeUser((user, done) => {
                             done(null, user);
                            });
                          return done (null, user);
                           }
                           
                       if  (! isValidPassword(password,user.password)) {
                           user = "invalid_pass"
                           passport.serializeUser((user, done) => {
                            done(null, user);
                          }); 
                          return done (null, user);
                          }
                      
                     
    ////////////////////////////////////////////////////////////////////////////////////////////////      
         
      
       return done (null, user);
     } catch (error) {
      done(error);
    }
  })
);



////////////////////////Estrategia JWT /////////////////////////////////////
passport.use(
    "jwt",
    new JWTStrategy(
      {jwtFromRequest: ExtractJWT.fromExtractors([cookieExtractor]), secretOrKey: envs.JWT_SECRET_CODE},
      async (jwt_payload, done) => {
        //console.log('jwt_payload=',jwt_payload) 
        //console.log(req.cookies.token_by_cookie)
        try {
            
            return done(null, jwt_payload);
            
          } catch (error) {
            return done(error);
          }
      }
    )
  )


}

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await userRepository.getById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});


