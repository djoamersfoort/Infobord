module.exports = function(keys, user, pass, perm) {
	return (keys[user] !== undefined && keys[user].pass === pass && (perm === undefined || keys[user].perms.indexOf(perm) !== -1));
};
