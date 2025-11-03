const express=require("express")


const app=express()
app.use(express.json())
app.use(express.urlencoded({extended:true}))

app.use((req,res)=>{
    console.log(req)
})

app.listen(3000,()=>{
    console.log("server is running as http://localhost:3000")
})