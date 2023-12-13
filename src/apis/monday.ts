require('dotenv').config();
import { Request, Response, NextFunction } from 'express';
import controllers from '../controllers';

// Admin
const getMondayData = async () => {
    try {
        let query = "query {users (limit:50) {created_at email account { name id}}}";

        fetch("https://api.monday.com/v2", {
            method: 'post',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': process.env.MONDAY_API_TOKEN
            },
            body: JSON.stringify({
                query: query
            })
        })
            .then(res => res.json())
            .then(res => console.log(JSON.stringify(res, null, 2)));
    } catch (e: any) {
        console.log("Error getting Monday: ", e);
    }
};

export default getMondayData;
