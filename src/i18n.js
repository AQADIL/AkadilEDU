import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  kk: {
    translation: {
      // Header
      'header.logo': 'AkadilEDU',
      'header.theme.light': 'Ашық режим',
      'header.theme.dark': 'Қараңғы режим',
      
      // Sidebar
      'sidebar.home': 'Басты бет',
      'sidebar.courses': 'Курстар',
      'sidebar.myCourses': 'Менің курстарым',
      'sidebar.testUBT': 'Тест ҰБТ',
      'sidebar.shop': 'Дүкен',
      'sidebar.admin': 'Әкімші',
      
      // Profile Modal
      'profile.title': 'Профиль баптаулары',
      'profile.firstName': 'Аты',
      'profile.lastName': 'Тегі',
      'profile.email': 'Email',
      'profile.phone': 'Телефон',
      'profile.password': 'Құпия сөз',
      'profile.newPassword': 'Жаңа құпия сөз',
      'profile.confirmPassword': 'Құпия сөзді растау',
      'profile.save': 'Сақтау',
      'profile.cancel': 'Болдырмау',
      'profile.uploadAvatar': 'Аватар жүктеу',
      'profile.removeAvatar': 'Аватарды жою',
      'profile.changeAvatar': 'Аватарды өзгерту',
      
      // Auth Pages
      'auth.signIn': 'Кіру',
      'auth.signUp': 'Тіркелу',
      'auth.signInToAccount': 'Аккаунтқа кіру',
      'auth.createAccount': 'Аккаунт жасау',
      'auth.email': 'Email',
      'auth.password': 'Құпия сөз',
      'auth.confirmPassword': 'Құпия сөзді растау',
      'auth.firstName': 'Аты',
      'auth.lastName': 'Тегі',
      'auth.forgotPassword': 'Құпия сөзді ұмыттыңыз ба?',
      'auth.resetPassword': 'Құпия сөзді қалпына келтіру',
      'auth.sendResetLink': 'Қалпына келтіру сілтемесін жіберу',
      'auth.backToLogin': 'Кіруге оралу',
      'auth.google': 'Google арқылы жалғастыру',
      'auth.orContinueWith': 'Немесе басқа тәсілмен',
      'auth.signingIn': 'Кірілуде...',
      'auth.creatingAccount': 'Аккаунт жасалуда...',
      'auth.resetSent': 'Сілтеме жіберілді!',
      'auth.resetSentMessage': 'Құпия сөзді қалпына келтіру сілтемесі жіберілді',
      'auth.checkInbox': 'Хат жәшігіңізді тексеріңіз және сілтемені басыңыз.',
      'auth.resetInstructions': 'Email мекенжайыңызды енгізіңіз, біз сізге құпия сөзді қалпына келтіру сілтемесін жібереміз.',
      'auth.sending': 'Жіберілуде...',
      'auth.dontHaveAccount': 'Аккаунтыңыз жоқ па?',
      'auth.alreadyHaveAccount': 'Аккаунт бар ма?',
      'auth.signInHere': 'Осында кіріңіз',
      'auth.signUpHere': 'Тіркелу',
      'auth.accountCreated': 'Аккаунт жасалды!',
      'auth.verificationSent': 'Растау хаты жіберілді',
      'auth.verificationEmailSent': 'Растау хаты жіберілді',
      'auth.checkEmail': 'Хат жәшігіңізді тексеріңіз',
      'auth.redirecting': 'Кіру бетіне бағытталуда...',
      
      // Auth Errors
      'auth.errors.userNotFound': 'Бұл email бойынша аккаунт табылмады',
      'auth.errors.invalidEmail': 'Жарамсыз email мекенжайы',
      'auth.errors.resetFailed': 'Құпия сөзді қалпына келтіру сәтсіз. Қайталап көріңіз',
      'auth.errors.wrongPassword': 'Құпия сөз қате',
      'auth.errors.tooManyRequests': 'Тым көп әрекет. Кейінірек қайталаңыз',
      'auth.errors.resendFailed': 'Хат жіберу сәтсіз. Қайталап көріңіз',
      
      // Email Verification Messages
      'auth.hello': 'Сәлем',
      'auth.verificationLinkSent': 'Поштаңа растау сілтемесі жіберілді!',
      'auth.sentToEmail': 'Растау хаты жіберілді',
      'auth.checkSpam': 'Егер хатты көрмесең, Спам бөлімің да тексер!',
      'auth.clickLinkToVerify': 'Хаттағы сілтемені басып, аккаунтты расташы.',
      'auth.emailVerificationNote': 'Поштаңа растау сілтемесі жіберіледі. Кейде хат Спамға түсіп кете еді — тексеріп шық!',
      'auth.verifyFirst': 'Алдымен почтаңды раста',
      
      // Email Verification Banner
      'emailVerification.title': 'Email мекенжайы расталмаған',
      'emailVerification.message': 'Барлық функцияларға қол жеткізу үшін поштаңды растаңыз.',
      'emailVerification.resendButton': 'Қайта жіберу',
      'emailVerification.resending': 'Жіберілуде...',
      'emailVerification.resendSuccess': 'Растау хаты қайта жіберілді! Поштаңды тексер.',
      
      // Email Verification Process
      'auth.verifying': 'Растау үстінде...',
      'auth.verifyingMessage': 'Email мекенжайыңызды растап жатырмыз. Күте тұрыңыз.',
      'auth.emailVerified': 'Email расталды',
      'auth.emailVerifiedMessage': 'Email мекенжайыңыз сәтті расталды!',
      'auth.nowYouCanLogin': 'Енді аккаунтқа кіре аласыз!',
      'auth.redirectingToLogin': 'Кіру бетіне бағыттап жатырмыз...',
      'auth.verificationFailed': 'Растау сәтсіз',
      'auth.tryAgain': 'Қайтадан көру',
      'auth.emailVerifiedCanLogin': 'Email расталды! Енді кіре аласыз.',
      'auth.errors.expiredCode': 'Растау сілтемесінің мерзімі өтіп кеткен',
      'auth.errors.invalidCode': 'Жарамсыз растау сілтемесі',
      'auth.errors.userDisabled': 'Аккаунт өшірілген',
      'auth.errors.verificationFailed': 'Растау сәтсіз. Қайталап көріңіз',
      
      // Email Check Instructions
      'auth.checkYourEmail': 'Поштаңды тексер',
      'auth.verificationEmailSentTo': 'Растау хаты жіберілді:',
      'auth.importantNote': 'Маңызды!',
      'auth.checkSpamFolder': 'Спам қалтасын тексер',
      'auth.clickLinkInEmail': 'Хаттағы сілтемені бас',
      'auth.dontCloseThisPage': 'Бұл бетті жаппа',
      'auth.whatToDoNext': 'Не істеу керек:',
      'auth.step1OpenEmail': 'Поштаңды аш',
      'auth.step2FindLetter': '"AkadilEDU" хатын тап',
      'auth.step3ClickButton': 'Көк батырманы бас',
      'auth.step4ReturnAndLogin': 'Қайта оралып кір',
      'auth.afterVerification': 'Email растағаннан кейін мындағы батырманы басыңыз:',
      'auth.goToLogin': 'Кіру бетіне өту',
      
      // Email Verification Required Page
      'emailVerification.verificationRequired': 'Email растау қажет',
      'emailVerification.almostThere': 'Аз қалды',
      'emailVerification.sentVerificationTo': 'Растау хаты жіберілді:',
      'emailVerification.howToVerify': 'Қалай растау керек:',
      'emailVerification.step1Check': 'Поштаңды тексер (Спам қоса)',
      'emailVerification.step2FindEmail': '"AkadilEDU" хатын тап',
      'emailVerification.step3ClickLink': 'Хаттағы сілтемені бас',
      'emailVerification.step4ReturnHere': 'Мұнда қайта орал және тексер',
      'emailVerification.checkSpamWarning': 'Спам қалтасын тексер!',
      'emailVerification.spamExplanation': 'Кейде хат Спам қалтасына түсіп кетеді',
      'emailVerification.notYetVerified': 'Әлі расталмаған. Поштаңды тексер.',
      'emailVerification.checkFailed': 'Тексеру сәтсіз. Қайталап көр.',
      'emailVerification.iVerified': 'Мен растадым!',
      'emailVerification.checking': 'Тексерілуде...',
      'emailVerification.resendEmail': 'Хатты қайта жіберу',
      'emailVerification.logoutAndTryAnother': 'Шығу және басқа емайл жасау',
      'emailVerification.needHelp': 'Көмек керек пе? youtub.maj@gmail.com',
      
      // 404 Page
      'notFound.oops': 'Өй!',
      'notFound.pageNotFound': 'Бет табылмады',
      'notFound.message': 'Сіз іздеген бет жоқ немесе жылжытылған',
      'notFound.goHome': 'Бас бетке',
      'notFound.goBack': 'Артқа қайту',
      'notFound.funFact': 'Қызықты факт:',
      'notFound.fact': '404 қатесі HTTP протоколының бірінші нұсқасында пайда болды!',
      
      // Home Page
      'home.welcome': 'AkadilEDU платформасына қош келдіңіз',
      'home.subtitle': 'Заманауи білім беру платформасы',
      'home.featuredCourses': 'Ұсынылған курстар',
      'home.coursePlaceholder': 'Курс мазмұны жақында қосылады',
      'home.getStarted': 'Бастау',
      
      // Cookie Consent
      'cookie.title': 'Cookie келісімі',
      'cookie.message': 'Біз тек тақырып пен тіл баптауларын сақтау үшін қажетті cookie пайдаланамыз.',
      'cookie.accept': 'Қабылдау',
      'cookie.decline': 'Бас тарту',
      'cookie.settings': 'Cookie баптаулары',
      'cookie.clear': 'Барлық деректерді өшіру',
      'cookie.clearConfirm': 'Барлық сақталған деректерді өшіргіңіз келетініне сенімдісіз бе?',
      
      // Common
      'common.loading': 'Жүктелуде...',
      'common.error': 'Қате',
      'common.success': 'Сәтті',
      'common.close': 'Жабу',
    }
  },
  ru: {
    translation: {
      // Header
      'header.logo': 'AkadilEDU',
      'header.theme.light': 'Светлая тема',
      'header.theme.dark': 'Темная тема',
      
      // Sidebar
      'sidebar.home': 'Главная',
      'sidebar.courses': 'Курсы',
      'sidebar.myCourses': 'Мои курсы',
      'sidebar.testUBT': 'Тест ЕНТ',
      'sidebar.shop': 'Магазин',
      'sidebar.admin': 'Админ',
      
      // Profile Modal
      'profile.title': 'Настройки профиля',
      'profile.firstName': 'Имя',
      'profile.lastName': 'Фамилия',
      'profile.email': 'Email',
      'profile.phone': 'Телефон',
      'profile.password': 'Пароль',
      'profile.newPassword': 'Новый пароль',
      'profile.confirmPassword': 'Подтвердите пароль',
      'profile.save': 'Сохранить',
      'profile.cancel': 'Отмена',
      'profile.uploadAvatar': 'Загрузить аватар',
      'profile.removeAvatar': 'Удалить аватар',
      'profile.changeAvatar': 'Изменить аватар',
      
      // Auth Pages
      'auth.signIn': 'Войти',
      'auth.signUp': 'Зарегистрироваться',
      'auth.signInToAccount': 'Войдите в аккаунт',
      'auth.createAccount': 'Создать аккаунт',
      'auth.email': 'Email',
      'auth.password': 'Пароль',
      'auth.confirmPassword': 'Подтвердите пароль',
      'auth.firstName': 'Имя',
      'auth.lastName': 'Фамилия',
      'auth.forgotPassword': 'Забыли пароль?',
      'auth.resetPassword': 'Сброс пароля',
      'auth.sendResetLink': 'Отправить ссылку для сброса',
      'auth.backToLogin': 'Вернуться ко входу',
      'auth.google': 'Продолжить через Google',
      'auth.orContinueWith': 'Или продолжите с помощью',
      'auth.signingIn': 'Вход...',
      'auth.creatingAccount': 'Создание аккаунта...',
      'auth.resetSent': 'Ссылка отправлена!',
      'auth.resetSentMessage': 'Ссылка для сброса пароля отправлена на',
      'auth.checkInbox': 'Проверьте почту и нажмите на ссылку.',
      'auth.resetInstructions': 'Введите ваш email и мы отправим вам ссылку для сброса пароля.',
      'auth.sending': 'Отправка...',
      'auth.dontHaveAccount': 'Нет аккаунта?',
      'auth.alreadyHaveAccount': 'Уже есть аккаунт?',
      'auth.signInHere': 'Войдите здесь',
      'auth.signUpHere': 'Зарегистрируйтесь',
      'auth.accountCreated': 'Аккаунт создан!',
      'auth.verificationSent': 'Письмо подтверждения отправлено',
      'auth.verificationEmailSent': 'Письмо подтверждения отправлено на',
      'auth.checkEmail': 'Проверьте вашу почту',
      'auth.redirecting': 'Перенаправление на страницу входа...',
      
      // Auth Errors
      'auth.errors.userNotFound': 'Пользователь с таким email не найден',
      'auth.errors.invalidEmail': 'Неверный email адрес',
      'auth.errors.resetFailed': 'Сброс пароля не удался. Попробуйте еще раз',
      'auth.errors.wrongPassword': 'Неверный пароль',
      'auth.errors.tooManyRequests': 'Слишком много попыток. Попробуйте позже',
      'auth.errors.resendFailed': 'Не удалось отправить письмо. Попробуйте еще раз',
      
      // Email Verification Messages
      'auth.hello': 'Привет',
      'auth.verificationLinkSent': 'Ссылка для подтверждения отправлена на почту!',
      'auth.sentToEmail': 'Письмо подтверждения отправлено на',
      'auth.checkSpam': 'Если не видишь письмо, проверь папку Спам!',
      'auth.clickLinkToVerify': 'Нажми на ссылку в письме, чтобы подтвердить аккаунт.',
      'auth.emailVerificationNote': 'На почту будет отправлена ссылка для подтверждения. Иногда письмо попадает в Спам — проверь!',
      'auth.verifyFirst': 'Сначала подтверди почту',
      
      // Email Verification Banner
      'emailVerification.title': 'Email не подтвержден',
      'emailVerification.message': 'Подтверди почту, чтобы получить доступ ко всем функциям.',
      'emailVerification.resendButton': 'Отправить повторно',
      'emailVerification.resending': 'Отправка...',
      'emailVerification.resendSuccess': 'Письмо отправлено повторно! Проверь почту.',
      
      // Email Verification Process
      'auth.verifying': 'Проверка...',
      'auth.verifyingMessage': 'Подтверждаем ваш email. Пожалуйста, подождите.',
      'auth.emailVerified': 'Email подтвержден',
      'auth.emailVerifiedMessage': 'Ваш email успешно подтвержден!',
      'auth.nowYouCanLogin': 'Теперь вы можете войти в аккаунт!',
      'auth.redirectingToLogin': 'Перенаправляем на страницу входа...',
      'auth.verificationFailed': 'Подтверждение не удалось',
      'auth.tryAgain': 'Попробовать снова',
      'auth.emailVerifiedCanLogin': 'Email подтвержден! Теперь можете войти.',
      'auth.errors.expiredCode': 'Срок действия ссылки истек',
      'auth.errors.invalidCode': 'Неверная ссылка подтверждения',
      'auth.errors.userDisabled': 'Аккаунт отключен',
      'auth.errors.verificationFailed': 'Подтверждение не удалось. Попробуйте еще раз',
      
      // Email Check Instructions
      'auth.checkYourEmail': 'Проверьте почту',
      'auth.verificationEmailSentTo': 'Письмо отправлено на:',
      'auth.importantNote': 'Важно!',
      'auth.checkSpamFolder': 'Проверьте папку Спам',
      'auth.clickLinkInEmail': 'Нажмите ссылку в письме',
      'auth.dontCloseThisPage': 'Не закрывайте эту страницу',
      'auth.whatToDoNext': 'Что делать дальше:',
      'auth.step1OpenEmail': 'Откройте почту',
      'auth.step2FindLetter': 'Найдите письмо от "AkadilEDU"',
      'auth.step3ClickButton': 'Нажмите синюю кнопку',
      'auth.step4ReturnAndLogin': 'Вернитесь и войдите',
      'auth.afterVerification': 'После подтверждения email нажмите эту кнопку:',
      'auth.goToLogin': 'Перейти ко входу',
      
      // Email Verification Required Page
      'emailVerification.verificationRequired': 'Требуется подтверждение Email',
      'emailVerification.almostThere': 'Почти готово! Остался один шаг',
      'emailVerification.sentVerificationTo': 'Письмо отправлено на:',
      'emailVerification.howToVerify': 'Как подтвердить:',
      'emailVerification.step1Check': 'Проверьте почту (включая Спам)',
      'emailVerification.step2FindEmail': 'Найдите письмо от "AkadilEDU"',
      'emailVerification.step3ClickLink': 'Нажмите на ссылку в письме',
      'emailVerification.step4ReturnHere': 'Вернитесь сюда и проверьте',
      'emailVerification.checkSpamWarning': 'Проверьте папку Спам!',
      'emailVerification.spamExplanation': 'Иногда письмо попадает в Спам',
      'emailVerification.notYetVerified': 'Еще не подтверждено. Проверьте почту.',
      'emailVerification.checkFailed': 'Проверка не удалась. Попробуйте еще раз.',
      'emailVerification.iVerified': 'Я подтвердил!',
      'emailVerification.checking': 'Проверяем...',
      'emailVerification.resendEmail': 'Отправить письмо снова',
      'emailVerification.logoutAndTryAnother': 'Выйти и попробовать другой email',
      'emailVerification.needHelp': 'Нужна помощь? youtub.maj@gmail.com',
      
      // 404 Page
      'notFound.oops': 'Упс!',
      'notFound.pageNotFound': 'Страница не найдена',
      'notFound.message': 'Страница, которую вы ищете, не существует или была перемещена',
      'notFound.goHome': 'На главную',
      'notFound.goBack': 'Назад',
      'notFound.funFact': 'Интересный факт:',
      'notFound.fact': 'Ошибка 404 использовалась еще в первой версии HTTP протокола!',
      
      // Home Page
      'home.welcome': 'Добро пожаловать в AkadilEDU',
      'home.subtitle': 'Ваша современная образовательная платформа',
      'home.featuredCourses': 'Избранные курсы',
      'home.coursePlaceholder': 'Содержимое курса скоро появится',
      'home.getStarted': 'Начать',
      
      // Cookie Consent
      'cookie.title': 'Согласие на использование cookie',
      'cookie.message': 'Мы используем только необходимые cookie для хранения настроек темы и языка. Отслеживание и аналитика не используются.',
      'cookie.accept': 'Принять',
      'cookie.decline': 'Отклонить',
      'cookie.settings': 'Настройки cookie',
      'cookie.clear': 'Очистить все данные',
      'cookie.clearConfirm': 'Вы уверены, что хотите очистить все сохраненные данные?',
      
      // Common
      'common.loading': 'Загрузка...',
      'common.error': 'Ошибка',
      'common.success': 'Успешно',
      'common.close': 'Закрыть',
    }
  },
  en: {
    translation: {
      // Header
      'header.logo': 'AkadilEDU',
      'header.theme.light': 'Light mode',
      'header.theme.dark': 'Dark mode',
      
      // Sidebar
      'sidebar.home': 'Home',
      'sidebar.courses': 'Courses',
      'sidebar.myCourses': 'My Courses',
      'sidebar.testUBT': 'UBT Test',
      'sidebar.shop': 'Shop',
      'sidebar.admin': 'Admin',
      
      // Profile Modal
      'profile.title': 'Profile Settings',
      'profile.firstName': 'First Name',
      'profile.lastName': 'Last Name',
      'profile.email': 'Email',
      'profile.phone': 'Phone',
      'profile.password': 'Password',
      'profile.newPassword': 'New Password',
      'profile.confirmPassword': 'Confirm Password',
      'profile.save': 'Save Changes',
      'profile.cancel': 'Cancel',
      'profile.uploadAvatar': 'Upload Avatar',
      'profile.removeAvatar': 'Remove Avatar',
      'profile.changeAvatar': 'Change Avatar',
      
      // Auth Pages
      'auth.signIn': 'Sign In',
      'auth.signUp': 'Sign Up',
      'auth.signInToAccount': 'Sign in to your account',
      'auth.createAccount': 'Create your account',
      'auth.email': 'Email',
      'auth.password': 'Password',
      'auth.confirmPassword': 'Confirm Password',
      'auth.firstName': 'First Name',
      'auth.lastName': 'Last Name',
      'auth.forgotPassword': 'Forgot Password?',
      'auth.resetPassword': 'Reset Password',
      'auth.sendResetLink': 'Send Reset Link',
      'auth.backToLogin': 'Back to Login',
      'auth.google': 'Continue with Google',
      'auth.orContinueWith': 'Or continue with',
      'auth.signingIn': 'Signing in...',
      'auth.creatingAccount': 'Creating account...',
      'auth.resetSent': 'Link Sent!',
      'auth.resetSentMessage': 'Password reset link sent to',
      'auth.checkInbox': 'Check your inbox and click the link.',
      'auth.resetInstructions': 'Enter your email address and we will send you a password reset link.',
      'auth.sending': 'Sending...',
      'auth.dontHaveAccount': "Don't have an account?",
      'auth.alreadyHaveAccount': 'Already have an account?',
      'auth.signInHere': 'Sign in here',
      'auth.signUpHere': 'Sign up',
      'auth.accountCreated': 'Account Created!',
      'auth.verificationSent': 'Verification email sent',
      'auth.verificationEmailSent': 'We\'ve sent a verification email to',
      'auth.checkEmail': 'Check your email',
      'auth.redirecting': 'Redirecting to login page...',
      
      // Auth Errors
      'auth.errors.userNotFound': 'No account found with this email',
      'auth.errors.invalidEmail': 'Invalid email address',
      'auth.errors.resetFailed': 'Password reset failed. Please try again',
      'auth.errors.wrongPassword': 'Incorrect password',
      'auth.errors.tooManyRequests': 'Too many attempts. Please try again later',
      'auth.errors.resendFailed': 'Failed to send email. Please try again',
      
      // Email Verification Messages
      'auth.hello': 'Hello',
      'auth.verificationLinkSent': 'Verification link sent to your email!',
      'auth.sentToEmail': 'Verification email sent to',
      'auth.checkSpam': 'If you don\'t see the email, check your Spam folder!',
      'auth.clickLinkToVerify': 'Click the link in the email to verify your account.',
      'auth.emailVerificationNote': 'A verification link will be sent to your email. Sometimes it goes to Spam — check it!',
      'auth.verifyFirst': 'Please verify your email first',
      
      // Email Verification Banner
      'emailVerification.title': 'Email not verified',
      'emailVerification.message': 'Verify your email to access all features.',
      'emailVerification.resendButton': 'Resend',
      'emailVerification.resending': 'Sending...',
      'emailVerification.resendSuccess': 'Verification email resent! Check your inbox.',
      
      // Email Verification Process
      'auth.verifying': 'Verifying...',
      'auth.verifyingMessage': 'Verifying your email address. Please wait.',
      'auth.emailVerified': 'Email Verified',
      'auth.emailVerifiedMessage': 'Your email has been successfully verified!',
      'auth.nowYouCanLogin': 'You can now log in to your account!',
      'auth.redirectingToLogin': 'Redirecting to login page...',
      'auth.verificationFailed': 'Verification Failed',
      'auth.tryAgain': 'Try Again',
      'auth.emailVerifiedCanLogin': 'Email verified! You can now log in.',
      'auth.errors.expiredCode': 'Verification link has expired',
      'auth.errors.invalidCode': 'Invalid verification link',
      'auth.errors.userDisabled': 'Account has been disabled',
      'auth.errors.verificationFailed': 'Verification failed. Please try again',
      
      // Email Check Instructions
      'auth.checkYourEmail': 'Check Your Email',
      'auth.verificationEmailSentTo': 'Verification email sent to:',
      'auth.importantNote': 'Important!',
      'auth.checkSpamFolder': 'Check Spam folder',
      'auth.clickLinkInEmail': 'Click the link in email',
      'auth.dontCloseThisPage': 'Don\'t close this page',
      'auth.whatToDoNext': 'What to do next:',
      'auth.step1OpenEmail': 'Open your email',
      'auth.step2FindLetter': 'Find letter from "AkadilEDU"',
      'auth.step3ClickButton': 'Click the blue button',
      'auth.step4ReturnAndLogin': 'Return and login',
      'auth.afterVerification': 'After verifying your email, click this button:',
      'auth.goToLogin': 'Go to Login',
      
      // Email Verification Required Page
      'emailVerification.verificationRequired': 'Email Verification Required',
      'emailVerification.almostThere': 'Almost there! Just one more step',
      'emailVerification.sentVerificationTo': 'Verification email sent to:',
      'emailVerification.howToVerify': 'How to verify:',
      'emailVerification.step1Check': 'Check your email (including Spam)',
      'emailVerification.step2FindEmail': 'Find the email from "AkadilEDU"',
      'emailVerification.step3ClickLink': 'Click the link in the email',
      'emailVerification.step4ReturnHere': 'Return here and check',
      'emailVerification.checkSpamWarning': 'Check your Spam folder!',
      'emailVerification.spamExplanation': 'Sometimes the email goes to Spam',
      'emailVerification.notYetVerified': 'Not verified yet. Check your email.',
      'emailVerification.checkFailed': 'Check failed. Please try again.',
      'emailVerification.iVerified': 'I Verified!',
      'emailVerification.checking': 'Checking...',
      'emailVerification.resendEmail': 'Resend Email',
      'emailVerification.logoutAndTryAnother': 'Logout and try another email',
      'emailVerification.needHelp': 'Need help? youtub.maj@gmail.com',
      
      // 404 Page
      'notFound.oops': 'Oops!',
      'notFound.pageNotFound': 'Page Not Found',
      'notFound.message': 'The page you\'re looking for doesn\'t exist or has been moved',
      'notFound.goHome': 'Go Home',
      'notFound.goBack': 'Go Back',
      'notFound.funFact': 'Fun Fact:',
      'notFound.fact': 'The 404 error has been used since the first version of HTTP protocol!',
      
      // Home Page
      'home.welcome': 'Welcome to AkadilEDU',
      'home.subtitle': 'Your modern educational platform',
      'home.featuredCourses': 'Featured Courses',
      'home.coursePlaceholder': 'Course content coming soon',
      'home.getStarted': 'Get Started',
      
      // Cookie Consent
      'cookie.title': 'Cookie Consent',
      'cookie.message': 'We use essential cookies to store your theme and language preferences.',
      'cookie.accept': 'Accept',
      'cookie.decline': 'Decline',
      'cookie.settings': 'Cookie Settings',
      'cookie.clear': 'Clear All Data',
      'cookie.clearConfirm': 'Are you sure you want to clear all stored data?',
      
      // Common
      'common.loading': 'Loading...',
      'common.error': 'Error',
      'common.success': 'Success',
      'common.close': 'Close',
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: 'kk', // Default language: Kazakh
    fallbackLng: 'kk',
    supportedLngs: ['kk', 'ru', 'en'],
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'ak_lang'
    },
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
