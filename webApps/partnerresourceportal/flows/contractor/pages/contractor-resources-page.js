define(['jsondiff','vb/helpers/rest'], (JsonDiffPlugin,Rest) => {
  'use strict';
    let nextIdValue;
  class PageModule {
      
    processFile(fileSet) {

      var reader = new FileReader();
      return new Promise(function (resolve, reject) {
        var reader = new FileReader();

        reader.onloadend = function (e) {
          var data = e.target.result;
          var workbook = XLSX.read(data, { type: 'binary' });
          var first_worksheet = workbook.Sheets[workbook.SheetNames[0]];
          var jsonArr = XLSX.utils.sheet_to_json(first_worksheet, { header: 1 });
          console.log(jsonArr);
          resolve(jsonArr);
        };
        reader.readAsBinaryString(fileSet[0]);
      });
    };

    createColumnsArray(jsonArr) {

      var x = [];
      for (var i = 0; i < jsonArr[0].length; i++) {

        x.push({ "headerText": jsonArr[0][i], "field": "c" + i });

      }
      console.log(JSON.stringify(x));
      return x;
    };

   async createDataArray(jsonArr) {
      var x = [];
      var rowStatus = {};
      for (var j = 1; j < jsonArr.length; j++) {
        var obj = {};
        if(jsonArr[j][1] != ''){
         await Rest.get('businessObjects/getall_Users').parameters({q: `Email = '${jsonArr[j][1]}'`}).fetch()
         .then((res) => {
              if (res.body.items.length > 0) {
                    obj['Id'] = res.body.items[0].id;
                    rowStatus[res.body.items[0].id] = "modified";
              }
              else{
                obj['Id'] = j;
                rowStatus[j] = "inserted";
              }

         });
        }
        else{
        obj['Id'] = j;
        rowStatus[j] = "inserted";
        }

        for(var i = 0; i < jsonArr[0].length; i++) {
                  var objName = jsonArr[0][i];
                  var objValue = jsonArr[j][i];
          
                  obj[objName] = objValue;
          
          }
          x.push(obj);
    }
      console.log("Data array value is::" + JSON.stringify(x));
      console.log("Row Status value is::" + JSON.stringify(rowStatus));
      return [x,rowStatus];
    };

    generateBatchSnippet(url, payload, operation, id) {
      return {
        id: id ? id : "someID",
        path: url,
        operation: operation,
        payload: payload ? payload : {}
      };
    };

    createBatchPayload(usersArray,rowStatus,contractorName,contractorUserId) {
      var payloads = [];
      var record;
     
      Object.keys(rowStatus).forEach(key => {
        var change = rowStatus[key];
        key = parseInt(key);
        if (change === 'deleted') {
          payloads.push(this.generateBatchSnippet("/Users/" +
            key, {}, 'delete'));
        } else if (change === 'inserted') {
          record = usersArray.find(e => e.Id === key);
          record.contractorName = contractorName;
          record.contractorUserId = contractorUserId;
          record.status = 'InProgress';
          delete record.Id;
          payloads.push(this.generateBatchSnippet("/Users",
            record, 'create'));
        } else if (change === 'modified') {
          record = usersArray.find(e => e.Id === key);
          record.contractorName = contractorName;
          record.contractorUserId = contractorUserId;
          record.status = 'InProgress';
          delete record.Id;
          payloads.push(this.generateBatchSnippet("/Users/" +
            key, record, 'update'));
        }
      
      });

      return {
        parts: payloads
      };
    };
  
    getNextId(partArray) {
    
      if (nextIdValue === undefined) {
        nextIdValue = 1000000;
        partArray.forEach(e => {
          if (e.id > nextIdValue) nextIdValue = e.id;
        });
      }
      ++nextIdValue;
      return nextIdValue;
    };



    areDifferent(oldValue, newValue) {

      let JSON_DIFF = JsonDiffPlugin.create({
        arrays: {
          detectMove: false,
        },
        cloneDiffValues: false,
      });

      var diff = JSON_DIFF.diff(oldValue, newValue);
      return diff !== undefined;
    };

  }

  return PageModule;
});
