import User from "./user.model.js";

async function createUser(firstName,lastName,email,password){
   //validation
   if (!firstName || !email || !password) {
     const error = new Error("Provide all required fields");
     error.statusCode = 400;
     throw error;
   }
   //register in db
  const userData = {
     firstName,
     email,
     password,
   };

  if (lastName?.trim()) {
    userData.lastName = lastName;
  }

  const user = await User.create(userData);
  return user
} 
export{
  createUser
}
