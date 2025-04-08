const config = {
    jwtSecret: process.env.JWT_SECRET || '123',
    jwtExpiresIn: '24h',
    saltRounds: 10,
    resetTokenExpiryHours: 1,
    activationTokenExpiryDays: 7,
    pointsPerDollar: 4, // 1 point per $0.25 = 4 points per $1
    roles: {
      REGULAR: 'regular',
      CASHIER: 'cashier',
      MANAGER: 'manager',
      SUPERUSER: 'superuser'
    },
    passwordRegex: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/,
    emailRegex: /^[a-zA-Z0-9._%+-]+@mail\.utoronto\.ca$/,
    utoridRegex: /^[a-zA-Z0-9]{8}$/,
    resetRateLimitSeconds: 60
};

module.exports = config;