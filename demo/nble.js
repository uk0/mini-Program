// pages/nb/autosearch/index.js
const bleManager = require('../../../utils/bluetoothManager.js');
const util = require('../../../utils/util.js')
const getHttpEaven = util.wxPromisify(wx.request) //Promisify 微信小程序异步请求。
const systemInfo = wx.getSystemInfoSync()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    deviceId: '',
    connaims: 'FF:11:22:33:44:55',
    serviceId: '',
    characteristId: '',
    deviceList: [],
  },
  down: function () {
    return getHttpEaven({
      url: 'http://127.0.0.1:8080/gm/control/operate?slaveId=000870430872&action=1',
      method: 'GET'
    }).then(function (res) {
      console.log(res);
    })
  },
  up: function () {
    return getHttpEaven({
      url: 'http://127.0.0.1:8080/gm/control/operate?slaveId=000870430872&action=2',
      method: 'GET'
    }).then(function (res) {
      console.log(res);
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log("onLoad ...");
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    console.log("page is ready");
    var self = this;
    console.log(systemInfo.platform);
  },

  //Promise open BLE
  openBle: function (resolve, reject) {
    let self = this;
    let dev = self.data.deviceList;
    wx.openBluetoothAdapter({
      success: function (res) {
        resolve(res)
        console.log("_openBle invoke success");
      },
      //open bt. adapter fail
      fail: function (res) {
        resolve(res)
      },
    })
  },
  //Promise start BluetoothDevicesDiscovery
  startBleDD: function (resolve, reject){
    wx.startBluetoothDevicesDiscovery({
      services: ['FEE7'],
      success: function (res) {
        console.log("_startBleDD invoke success");
        resolve(res);
      },
      fail: function (res) {
        resolve(res)
      },
    })
  },
  //Promise  findDevice
  foundDevice: function (resolve, reject){
    let self = this;
    let dev = self.data.deviceList;
    wx.onBluetoothDeviceFound(function (res) {
      console.log('new device list has founded');
      dev.push(res.devices[0]);
      self.setData({
        deviceList: dev
      });
      for (let i = 0; i < self.data.deviceList.length; i++) {
        console.log(self.data.deviceList[i].advertisData);
        let resultData = self.buf2hex(self.data.deviceList[i].advertisData); //转换
        console.log("扫描到的设备: " + resultData);
        console.log("目标MAC:   " + self.data.connaims); //提取最后12位
        if (self.data.connaims.replace(/:/g, "").toLowerCase() == resultData.slice(-12)) { //判断小写
          if (systemInfo.platform == 'android') {
            console.log("android 实时DeviceId: " + self.data.deviceList[i].deviceId);
            self.data.deviceId = self.data.deviceList[i].deviceId;
            resolve("success"); //成功
          } else {
            console.log("ios 实时DeviceId: " + self.data.deviceList[i].deviceId);
            resolve("success"); //成功
            self.data.deviceId = self.data.deviceList[i].deviceId;
          }
        }
      }
    })
    console.log("_foundDevice invoke success");
  },
  //Promisr connection 
  connectionDevice: function (resolve, reject){
    var self = this;
    console.log("_connectionDevice invoke success");
    //换一个版本
    bleManager.connectDevice(self.data.deviceId).then((res) => {
      console.log("链接设备 start");
      if (res.errCode == 0) {
        for (var a = 0; a < res.services.length; a++) {
          if (res.services[a].uuid.indexOf('FEE7') != -1) {
            self.data.serviceId = res.services[a].uuid;
            console.log("services Id start")
            console.log(res.services[a].uuid);
            console.log("services Id end")
            resolve(0);
          }
        }
      }
    })
  },
  //Promisr getDeviceCharacteristics
  getDeviceCharacteristics: function (resolve, reject){
    console.log("_getDeviceCharacteristics invoke success ");
    var self = this;
    bleManager.getDeviceCharacteristics(self.data.deviceId, self.data.serviceId).then((res) => {
      for (let i = 0; i < res.characteristics.length; i++) {
        if (res.characteristics[i].properties.write) {
          console.log("res.characteristics[i].uuid:=" + res.characteristics[i].uuid);
          self.data.characteristId = res.characteristics[i].uuid; //赋值
          resolve(res.characteristics[i].uuid)//成功返回
        }
      }
    })
  },
  //Promisr sendHexTo device 
  sendHexToDevice: function (resolve, reject){
    console.log("_sendHexToDevice invoke success ")
    var self = this;
    var hex = 'FE010014753100000A0012065765436861741800' //激活包
    var typedArray = new Uint8Array(hex.match(/[\da-f]{2}/gi).map(function (h) {
      return parseInt(h, 16)
    }))
    console.log(typedArray)
    var buffer1 = typedArray.buffer
    console.log(buffer1)
    console.log("self.data.deviceId:=" + self.data.deviceId);
    console.log("self.data.serviceId:=" + self.data.serviceId);
    console.log("self.data.characteristId:=" + self.data.characteristId);

    bleManager.writeDeviceCharacteristicValue(self.data.deviceId, self.data.serviceId, self.data.characteristId, buffer1).then((r) => {
      console.log(r);
    })
  },
  //Promisr stop and close 
  stopSearchBleDevices: function (resolve, reject){
    wx.stopBluetoothDevicesDiscovery({ //stop search
      success: function (res) {
        console.log(res)
        resolve(res);
      }
    })
  },
  //Promisr close apder
  closeBluetoothAdapter: function (resolve, reject){
    wx.closeBluetoothAdapter({
      success: function (res) {
        console.log(res)
        resolve(res);
      }
    })
  },

  //unConn adaper device 
  closeBLEConnection: function (resolve, reject){
  let self = this;
  wx.closeBLEConnection({
    deviceId: self.data.deviceId,
    success: function (res) {
      console.log(res)
      resolve(res);
    }
  })
},
  //bleManager.stopSearchDevice()
  autoStart:function(){
    let self = this;
    var _openBle = new Promise(self.openBle); //打开蓝牙
    _openBle
      .then(()=>{
       return  new Promise(self.startBleDD) //开启扫描
      })
      .then(()=>{
        return new Promise(self.foundDevice) //扫描service 以及device
      })
      .then(() => {
        return new Promise(self.connectionDevice) //通过DeviceId 链接设别
      })
      .then(()=>{
        return new Promise(self.getDeviceCharacteristics) //获得特征码
      })
      .then(()=>{
        return new Promise(self.sendHexToDevice) //发送数据
      }).catch((err) => {
        console.log(err)
      })
      .finally(()=>{
        console.log("done clear ...")//关闭蓝牙模块，使其进入未初始化状态
        return new Promise(self.stopSearchBleDevices).then(() => {//停止搜索
          
          return new Promise(self.closeBLEConnection).then(() => { //断开与低功耗蓝牙设备的连接

            return new Promise(self.closeBluetoothAdapter).then(()=>{
              bleManager.stopSearchDevice();
            })   
          })
        })
        
      });
  },



  buf2hex: function (buffer) {
    return Array.prototype.map.call(new Uint8Array(buffer), x => ('00' + x.toString(16)).slice(-2)).join('');
  },
  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    let self = this;
  },

  closeConn:function(){
    bleManager.stopSearchDevice()
  }

})
