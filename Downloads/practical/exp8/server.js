const express=require("express");
const app=express();
app.use(express.json());
let students=[
];
app.get("/",(req,res)=>{
    res.json(students);
});
app.post("/student",(req,res)=>{
    students.push(req.body)
    res.json({
       message: "succesfully post"
    })
});
app.put("/student/:id",(req,res)=>{
    let student=students.find(s=>s.id==req.params.id)
    if(!student) return res.send("not found")
    Object.assign(student,req.body)
res.send("updates")
    }
)
app.delete("/student/:id",(req,res)=>{
    students=students.filter(s=>s.id!=req.params.id)
    res.json({
        message:"delted"
    })
}
);
app.listen(3000,()=>{
    console.log("run on port 3000")
})