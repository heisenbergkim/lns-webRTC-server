module.exports = function(app, fs)
{

     app.get('/:roomname',function(req,res){
        var username = req.params.roomname;

         res.render('index', {
             strRoomName: username
         })
     });



}

