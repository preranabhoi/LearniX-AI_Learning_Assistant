import Document from '../models/Document.js'
import Flashcard from '../models/Flashcard.js'
import Quiz from '../models/Quiz.js'
import {extractTextFromPDF,chunkText} from '../utils/textChunker.js'
import fs from 'fs/promises'
import mongoose from 'mongoose'

export const uploadDocument=async(req,res,next)=>{
    try {
        if(!req.file){
            return res.status(400).json({
                success:false,
                error:'Please upload a PDF file',
                statusCode:400
            })
        }

        const{title}=req.body

        if(!title){
            await fs.unlink(req.file.path)
            return res.status(400).json({
                success:false,
                error:'Please provide a document title',
                statusCode:400
            })
        }

        const baseUrl=`http://localhost:${process.env.PORT||8000}`
        const fileUrl=`${baseUrl}/uploads/documents/${req.file.filename}`

        const document=await Document.create({
            userId:req.user._id,
            title,
            fileName:req.file.originalname,
            filePath:fileUrl,
            fileSize:req.file.size,
            status:'processing'
        })

        processPDF(document._id,req.file.path).catch(err=>{
            console.error('PDF processing error:',err)
        })

        res.status(201).json({
            success:true,
            data:document,
            message:'Document uploaded successfully. Processing i progress...'
        })
    } catch (error) {
        if(req.file){
            await fs.unlink(req.file.path).catch(()=>{})
        }
        next(error)
    }
}

//Helper function to process PDF

const processPDF=async(documentId,filePath)=>{
    try {
        const {text}=await extractTextFromPDF(filePath)

        //create chunks
        const chunks=chunkText(text,500,50)

        //update document
        await Document.findByIdAndUpdate(documentId,{
            extractedText:text,
            chunks:chunks,
            status:'ready'
        })
        console.log(`Document ${documentId} processed successfully`)
    } catch (error) {
        console.error(`Error processing document ${documentId}:`,error)

        await Document.findByIdAndUpdate(documentId,{
            status:'failed'
        })
    }
}

export const getDocuments=async(req,res,next)=>{
    try {
        const documents=await Document.aggregate([
            {
                $match:{userId:new mongoose.Types.ObjectId(req.user._id)}
            },
            {
                $lookup:{
                    from:'flashcards',
                    localField:'_id',
                    foreignField:'documentId',
                    as:'flashcardSets'
                }
            },{
                $lookup:{
                    from:'quizzes',
                    localField:'_id',
                    foreignField:'documentId',
                    as:'quizzes'
                }
            },{
              $addFields:{
                flashcardCount:{$size:'$flashcardSets'},
                quizCount:{$size:'$quizzes'}
              }  
            },{
                $project:{
                    extractedText:0,
                    chunks:0,
                    flashcardSets:0,
                    quizzes:0
                }
            },{
                $sort:{uploadDate:-1}
            }
       ])

       res.status(200).json({
        success:true,
        count:documents.length,
        data:documents
       })
    } catch (error) {
        if(req.file){
            await fs.unlink(req.file.path).catch(()=>{})
        }
        next(error)
    }
}

