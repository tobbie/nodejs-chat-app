const users = [];

const addUser = ({id, username, room}) =>{
    username = username.trim().toLowerCase();
    room = room.trim().toLowerCase();

    if(!username || !room){
        return {
            error: 'username and room are required'
        }
    }

    //check for existing user;
    const exisingUser = users.find((user) => {
        return user.room === room && user.username === username
    })

    //validate usernmae
    if(exisingUser){
        return{
            error: 'Username is in use!'
        }
    }

    const user = {id, username, room}
    users.push(user);
    return { user };
}


const removeUser = (id) => {

    const index = users.findIndex((user)=> {
        return user.id === id;
    })

    if(index !== -1){
       return users.splice(index,1)[0]
    }
}

const getUser = (id) => {
    const foundUser = users.find((user)=>{
        return user.id === id
    })

    if(!foundUser){
        return undefined;
    }
    return foundUser;
}

const getUsersInRoom = (room) => {
    room = room.trim().toLowerCase();
    const usersInRoom = users.filter((user)=>{
        return user.room === room
    }) 

    if(!usersInRoom){
        return [];
    }
    return usersInRoom;
    
}


module.exports = {
    addUser,
    getUser,
    removeUser,
    getUsersInRoom
}