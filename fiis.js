import { randomUUID } from "crypto";

export class Fiis{
    #nome = new Map();
    #valor = new Map();


    list(){
        return Array.from(this.#nome.entries()).map((nomeArray) => {
            const id = nomeArray[0]
            const data = nomeArray[1]
            
            return {id, 
                ...data}
        })
    }
    create(nome){
        const nomeID = randomUUID()
        this.#nome.set(nomeID, nome)
    }

    update(id, nome){
        this.#nome.set(id, nome)
    }
    delete(id){
        this.#nome.delete(id)
    }
}