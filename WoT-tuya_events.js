class Event{
    cause = null;
    effect = null;
    time = null;
    repeat = null;
    device = null;

    constructor(event){
        this.cause = event._cause;
        this.effect = event._effect;
        this.time = event._time;
        this.device = event._device
        this.repeat = event._repeat;
    }

    async check(){
        let data = await this.device.readProperty(this.cause.toCall);
        return data[this.cause.toCheck] == this.cause.value;

    }
    async exec(){
        await this.device.invokeAction(this.effect.toCall, this.effect.data).then((response)=>{
            if(!response.success){
                throw new Error("is not possible to resolve the event");
            }
        });
    }
    async start(){
        while(true){
            let success = await this.check()
            if(success){
                await this.exec()
                if(!this.repeat){
                    return;
                }
            }
            await delay(this.time)
        }
    }
}

function delay(ms) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}


module.exports = {Event}