let exec = require('child_process').exec

module.exports = (usernameIG) => {
  let cmd = 'wget https://instagram.com/'+usernameIG+' -qO -';
  let medias = [];
  return new Promise((resolve, reject) => {
    exec(cmd,function(err,so){
      if(err) {
        reject(err);
        return err;
      }
      output = so.split('window._sharedData = ')
      if(output.length > 1){
        let dataScrap = output[1].split(';</script>')
        let tojson = JSON.parse(dataScrap[0]);
        let userProfile = tojson.entry_data.ProfilePage[0].user
        let follower = userProfile.followed_by.count
        let following = userProfile.follows.count
        let bio = userProfile.biography
        let username = userProfile.username
        let profilePic = userProfile.profile_pic_url
        let fullname = userProfile.full_name
        let name = fullname || username
        let media = userProfile.media.nodes
        
		if( media.length > 0 ){
          for (var i = 0; i < 2; i++) {
            if(typeof media[i].thumbnail_src !== 'undefined') {
              medias.push(media[i].thumbnail_src);
            } else {
              medias = ' No Photo Uploaded ';
            }
          }
        } else {
          medias = '- User Is Private -';
        }
        let data = {
          userProfile: userProfile.profile_pic_url,
          userName: name,
          bio : bio,
          media: medias,
          follow :`Follower: ${follower} <=> Following: ${following}`,
        };
        resolve(data)
      } else {
        resolve('not found')
      }
    })
  })
}