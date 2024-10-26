const logout = (req, res) => {
  req.logout(err => {
    if (err) return next(err);
    req.session.destroy();
    res.redirect('/');
  });
};

module.exports = logout;
