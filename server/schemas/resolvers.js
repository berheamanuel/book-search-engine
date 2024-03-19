const { User, Book } = require("../models");
const { signToken, AuthenticationError } = require("../utils/auth");

const resolvers = {
  Query: {
    me: async (parent, args, { user }) => {

      try {
        const userData = await User.findOne({
          $or: [{ _id: user._id }, { username: user.username }],
        });
        if (!userData) {
          return { message: "No user found with this id!" };
        }

        return userData;
      } catch (err) {
        console.log(err);
        return { message: "An error occurred!" };
      }
    },
  },
  Mutation: {
    // set up addUser mutation so a user can be added to the database
    addUser: async (parent, { username, email, password }) => {
      
      const user = await User.create({ username, email, password });

      if (!user) {
        throw AuthenticationError;
      }

      const token = signToken(user);      

      return { token, user };
    },
    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email });
      if (!user) {
        throw AuthenticationError;
      }
      const correctPw = await user.isCorrectPassword(password);
      if (!correctPw) {
        throw AuthenticationError;
      }

      const token = signToken(user);
      return { token, user };
    },
    saveBook: async (parent, { bookInput }, context) => {
      if (context.user) {
        const updatedUser = await User.findOneAndUpdate(
          { _id: context.user._id },
          { $addToSet: { savedBooks: bookInput } },
          { new: true, runValidators: true}
        );
        return updatedUser;
      }
      throw AuthenticationError;
    },
    removeBook: async (parent, {bookId}, {user}) => {
      if (user) {
        const updatedUser = await User.findOneAndUpdate(
          { _id: user._id },
          { $pull: { savedBooks: { bookId: bookId } } },
          { new: true }
        );
        return updatedUser;
      }
      throw AuthenticationError;
    },
  },
};

module.exports = resolvers;
