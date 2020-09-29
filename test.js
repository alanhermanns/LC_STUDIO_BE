Promise.all([Time.find({}), User.find({})])
    .then((times, users) => {
       return times.map(time => {
           return users.map(user => {
                if(user.myTimeIds.includes(time._id)){
                    return {
                        email : user.email,
                        time : time.time,
                        roomeName : time.roomName[0]
                    }
                }
                else return
            })
        })
    })