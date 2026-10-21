package debugger.code.agent.system.controller;

import debugger.code.agent.system.entity.UserEntity;
import debugger.code.agent.system.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:5173")
public class UserController {

    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @PostMapping
    public ResponseEntity<?> createUser(@RequestBody UserEntity user) {

        if (userRepository.existsByLoginId(user.getLoginId())) {
            return ResponseEntity.badRequest()
                    .body("This login ID is already in use.");
        }

        // Do not save a real raw password like this in production.
        // Replace passwordHash with a BCrypt-hashed password later.
        UserEntity savedUser = userRepository.save(user);

        return ResponseEntity.status(HttpStatus.CREATED).body(savedUser);
    }
}