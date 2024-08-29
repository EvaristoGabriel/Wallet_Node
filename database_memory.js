import { randomUUID } from "crypto";

export class Database{
    #videos = new Map();


    list(){
        return Array.from(this.#videos.entries()).map((videoArray) => {
            const id = videoArray[0]
            const data = videoArray[1]
            
            return {id, 
                ...data}
        })
    }
    create(video){
        const videoID = randomUUID()
        this.#videos.set(videoID, video)
    }

    update(id, video){
        this.#videos.set(id, video)
    }
    delete(id){
        this.#videos.delete(id)
    }
}