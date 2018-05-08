# mini-Progra

* 内部存在的代码，为演示代码，可以执行，嵌入自己程序即可。


```javascript
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

```
