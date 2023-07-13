// en email lookup helper function
const getUserByEmail = (email, database) => {
  const users = database;
  for (const u in users) {
    const existingUser = users[u];
    if (existingUser.email === email) {
      return existingUser;
    }
  }
  return null;
};

module.exports = { getUserByEmail };