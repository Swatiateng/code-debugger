package debugger.code.agent.system;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;


@ConfigurationPropertiesScan
//@ConfigurationPropertiesScan allows Spring to load AiProperties.
@SpringBootApplication
public class SystemApplication {

	public static void main(String[] args) {


		SpringApplication.run(SystemApplication.class, args);
	}

}
