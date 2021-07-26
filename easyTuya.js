const TuyaContext = require ('@tuya/tuya-connector-nodejs').TuyaContext;

class _Tuya{
    region
    key
    secret
    user
    api

    possible_region = ['us','eu','cn','in']

    constructor(_region, _key, _secret){
        if (this.possible_region.indexOf(_region) < 0){
            throw new Error("wrong region paramenter, possible parameters are: ['us','eu','cn','in']");
        }
        this.api = new TuyaContext({
            baseUrl: `https://openapi.tuya${_region}.com`,
            accessKey: _key,
            secretKey: _secret
        });
        this.region = _region;
        this.key = _key;
        this.secret = _secret;
    }
    getApi(){
        return this.api;
    }

    async setUser(_devID){
        let result = await this.api.request({
            method: 'GET',
            path: `/v1.0/devices/${_devID}`
        });
        
        if (!result.success) {
            throw new Error(`${result.code}: ${result.msg}`);
        }
        else{
            this.user = (result.result).uid;
            return result.success; 
        }
    }
    async getDevices(){
        if(this.user == undefined){
            throw new Error("user was undefined, please set it with setUser(_devID)");
        }
        let result = await this.api.request({
            method: 'GET',
            path: `/v1.0/users/${this.user}/devices`
        });
        
        if (!result.success) {
            throw new Error(`${result.code}: ${result.msg}`);
        }
        else{
            return result; 
        }
    }
}



class Device {
    id
    api

    constructor(_id, _api){
        this.api = _api;
        this.id = _id;    
    }
    async getData(){
        let result = await this.api.getApi().request({
            method: 'GET',
            path: `/v1.0/devices/${this.id}`
        });
        
        if (!result.success) {
            throw new Error(`${result.code}: ${result.msg}`);
        }
        else{
            return result; 
        }
    }

    async deviceFunctions(){
        let result = await this.api.getApi().request({
            method: 'GET',
            path: `/v1.0/devices/${this.id}/specifications`
        });
        
        if (!result.success) {
            throw new Error(`${result.code}: ${result.msg}`);
        }
        else{
            return (result.result).functions; 
        }
    }

    async control(_toSet){
        
        let result = await this.api.getApi().request({
            method: 'POST',
            path: `/v1.0/devices/bff89e2b5a8e1516d6l89a/commands`,
            body:{
              commands: _toSet
            }
          });

        if (!result.success) {
            throw new Error(`${result.code}: ${result.msg}`);
        }
        else{
            return result; 
        }
    }

}

module.exports = {_Tuya, Device}