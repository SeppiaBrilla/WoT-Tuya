const Servient = require("@node-wot/core").Servient;
const Helpers  = require("@node-wot/core").Helpers;
const HttpClientFactory  = require('@node-wot/binding-http').HttpClientFactory;
const Event  = require("./WoT-tuya_events").Event;


const servient = new Servient();
servient.addClientFactory(new HttpClientFactory(undefined));
const WoTHelpers = new Helpers(servient);


function testNormal(){

        WoTHelpers.fetch("http://localhost:8080/smart-bulb-rgbcw").then(async (td) => {
            try {
                servient.start().then(async (WoT) => {
                    let thing = await WoT.consume(td);
                    console.log("the type is: ",typeof thing)
                    log('Thing Description:', td);
                    let AllPossibleValues = await thing.readProperty('AllPossibleValues');
                    log('AllPossibleValues value is:', AllPossibleValues);
                    let command = await thing.invokeAction('command', {
                            'name': 'switch_led',
                            'new_value': true,
                        });
                    if (command['success']) {
                        log('Done!', command);
                    }else{
                        throw new Error(command)
                    }
                    console.log((await thing.readProperty('AllPossibleValues')).switch_led)
                });
            }
            catch (err) {
                console.error('Script error:', err);
            }
        });
}

function testEvents(){
    WoTHelpers.fetch("http://localhost:8080/smart-bulb-by-tuya").then(async (td) => {
        try {
            servient.start().then(async (WoT) => {
                let thing = await WoT.consume(td);
                let event = new Event({
                    _cause:{
                        toCall:'AllPossibleValues', 
                        toCheck:'switch_led', 
                        value:false },
                    _effect:{
                        toCall:'command', 
                        data:{
                            'name': 'switch_led',
                            'new_value': true,
                        }
                    },
                    _time:1000,
                    _repeat:true,
                    _device:thing
                })
                event.start()
            });
        }
        catch (err) {
            console.error('Script error:', err);
        }
    });
}


function log(msg, data) {
    console.info('======================');
    console.info(msg);
    console.dir(data);
    console.info('======================');
}



testNormal();