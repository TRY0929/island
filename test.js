async function func1 () {
  try {
    await func2()
  } catch (error) {
    console.log('func1: error')
  }
}


async function func2 () {
  try {
    await func3()
  } catch (error) {
    console.log('error')
  }
}

async function func3 () {
  return new Promise ((resolve, reject) => {
    setTimeout(() => {
      reject(new Error)
    }, 1000)
  })
}