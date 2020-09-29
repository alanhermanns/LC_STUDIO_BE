let today = new Date(Date.now());
console.log(today.getTime())
  today = today.getTime() - 25200000;
    today = new Date(today);
    today = today.toISOString()
    console.log(today)