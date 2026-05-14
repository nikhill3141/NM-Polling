import express from 'express'


export async function createApp(){
  try {
    const app = express()

    return app
  } catch (error) {
    console.log(`Error in creation of App: ${error.message}`)
  }
}